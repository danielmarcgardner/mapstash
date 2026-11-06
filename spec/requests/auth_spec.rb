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
      expect(response.parsed_body["error"]).to include("Email has already been taken")
    end

    it "returns 422 when a concurrent signup beats the validation to the unique index" do
      create(:user, email: "taken@example.com")
      allow_any_instance_of(ActiveRecord::Validations::UniquenessValidator).to receive(:validate_each)

      signup(email: "taken@example.com")

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["error"]).to include("Email has already been taken")
    end

    it "returns 422 for a blank email" do
      signup(email: "")

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body).to have_key("error")
    end
  end
end
