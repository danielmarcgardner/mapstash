require 'rails_helper'

RSpec.describe "Auth", type: :request do
  let(:user_keys) { %w[id email first_name last_name] }

  describe "POST /api/login" do
    let(:password) { "unique-login-password-123" }
    let!(:user) { create(:user, password: password) }

    def login(with_password: password)
      post "/api/login",
           params: { user: { email: user.email, password: with_password } }.to_json,
           headers: AuthHelpers::JSON_HEADERS
    end

    it "returns only the serialized user and a token" do
      login

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.keys).to match_array(%w[user token])
      expect(response.parsed_body["user"].keys).to match_array(user_keys)
      expect(response.parsed_body["token"]).to be_present
    end

    it "returns 401 for a wrong password" do
      login(with_password: "wrong-password")

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body).to eq("errors" => [ "Invalid email or password" ])
    end

    it "returns 400 errors without a user param" do
      post "/api/login", params: { email: user.email }.to_json, headers: AuthHelpers::JSON_HEADERS

      expect(response).to have_http_status(:bad_request)
      expect(response.parsed_body["errors"]).to be_present
    end

    it "does not log the password" do
      io = StringIO.new
      capture = ActiveSupport::Logger.new(io)
      Rails.logger.broadcast_to(capture)

      begin
        login
      ensure
        Rails.logger.stop_broadcasting_to(capture)
      end

      expect(io.string).not_to include(password)
      expect(io.string).to include("[FILTERED]")
    end
  end

  describe "POST /api/signup" do
    it "returns 422 for a password shorter than 6 characters and creates no user" do
      expect {
        post "/api/signup", params: { user: { email: "short@example.com", password: "abcde" } }.to_json, headers: AuthHelpers::JSON_HEADERS
      }.not_to change(User, :count)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include(a_string_starting_with("Password is too short"))
    end

    it "returns a token that works on /api/users/me" do
      signup(email: "token@example.com")
      token = response.parsed_body["token"]

      get "/api/users/me", headers: AuthHelpers::JSON_HEADERS.merge("Authorization" => "Bearer #{token}")

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["email"]).to eq("token@example.com")
    end

    def signup(email:)
      post "/api/signup",
           params: { user: { email: email, password: "password123", first_name: "Map", last_name: "Stasher" } }.to_json,
           headers: AuthHelpers::JSON_HEADERS
    end

    it "returns only the serialized user and a token" do
      signup(email: "new@example.com")

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.keys).to match_array(%w[user token])
      expect(response.parsed_body["user"].keys).to match_array(user_keys)
      expect(response.parsed_body["token"]).to be_present
    end

    it "returns 422 for a duplicate email, ignoring case" do
      create(:user, email: "taken@example.com")

      signup(email: "TAKEN@example.com")

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include("Email has already been taken")
    end

    it "returns 422 when a concurrent signup beats the validation to the unique index" do
      create(:user, email: "taken@example.com")
      allow_any_instance_of(ActiveRecord::Validations::UniquenessValidator).to receive(:validate_each)

      signup(email: "taken@example.com")

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include("Email has already been taken")
    end

    it "returns 422 for a blank email" do
      signup(email: "")

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to be_present
    end
  end

  describe "GET /api/users/me without a token" do
    it "returns 401 errors for a malformed token" do
      get "/api/users/me", headers: AuthHelpers::JSON_HEADERS.merge("Authorization" => "Bearer not-a-jwt")

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["errors"]).to be_present
    end

    it "returns 401 errors from the failure app" do
      get "/api/users/me", headers: AuthHelpers::JSON_HEADERS

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body.keys).to eq([ "errors" ])
      expect(response.parsed_body["errors"]).to all(be_a(String).and(be_present))
    end
  end

  describe "DELETE /api/logout" do
    it "writes the token's jti to jwt_denylists" do
      headers = auth_headers(create(:user))
      jti = Warden::JWTAuth::TokenDecoder.new.call(headers["Authorization"].split.last)["jti"]

      expect { delete "/api/logout", headers: headers }.to change(JwtDenylist, :count).by(1)
      expect(JwtDenylist.last.jti).to eq(jti)
    end

    it "returns 204 and revokes the token" do
      headers = auth_headers(create(:user))

      delete "/api/logout", headers: headers
      expect(response).to have_http_status(:no_content)

      get "/api/users/me", headers: headers
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "PUT /api/signup" do
    it "updates the account with the current password" do
      user = create(:user)

      put "/api/signup", params: { user: { email: "changed@example.com", current_password: "password123" } }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:no_content)
      expect(user.reload.email).to eq("changed@example.com")
    end

    it "returns 422 errors as an array for a wrong current password" do
      user = create(:user)

      put "/api/signup", params: { user: { email: "changed@example.com", current_password: "wrong" } }.to_json, headers: auth_headers(user)

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to eq("errors" => [ "Current password is invalid" ])
      expect(user.reload.email).not_to eq("changed@example.com")
    end
  end
end
