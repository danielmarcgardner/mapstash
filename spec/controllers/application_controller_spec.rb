require 'rails_helper'

RSpec.describe ApplicationController, type: :controller do
  include Devise::Test::ControllerHelpers

  controller do
    def not_found = List.find(0)
    def invalid = List.create!(title: "")
    def missing_param = params.require(:list)
  end

  before do
    routes.draw do
      get "not_found" => "anonymous#not_found"
      get "invalid" => "anonymous#invalid"
      get "missing_param" => "anonymous#missing_param"
    end
  end

  it "renders RecordNotFound as 404 errors" do
    get :not_found

    expect(response).to have_http_status(:not_found)
    expect(response.parsed_body).to eq("errors" => [ "List not found" ])
  end

  it "renders RecordInvalid as 422 errors with the record's messages" do
    get :invalid

    expect(response).to have_http_status(:unprocessable_content)
    expect(response.parsed_body["errors"]).to include("User must exist", "Title can't be blank")
  end

  it "renders ParameterMissing as 400 errors" do
    get :missing_param

    expect(response).to have_http_status(:bad_request)
    expect(response.parsed_body["errors"]).to contain_exactly(a_string_including("list"))
  end
end
