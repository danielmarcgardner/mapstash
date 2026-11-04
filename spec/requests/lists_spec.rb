require 'rails_helper'

RSpec.describe "Lists", type: :request do
  describe "GET /api/lists" do
    let(:user) { create(:user) }

    it "returns only the current user's lists" do
      mine = create(:list, user: user)
      create(:list) # another user's

      get "/api/lists", headers: auth_headers(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.map { |l| l["id"] }).to eq([ mine.id ])
    end

    it "returns 401 without a token" do
      get "/api/lists", headers: AuthHelpers::JSON_HEADERS

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
