# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Frontend and health routes", type: :request do
  let(:public_dir) { Pathname(Dir.mktmpdir) }

  before do
    public_dir.join("index.html").write("<!doctype html><div id=\"root\"></div>")
    allow(Rails).to receive(:public_path).and_return(public_dir)
  end

  after { FileUtils.remove_entry(public_dir) }

  it "answers the health check at /up" do
    get "/up"
    expect(response).to have_http_status(:ok)
  end

  it "serves the app at /" do
    get "/", headers: { "Accept" => "text/html" }
    expect(response).to have_http_status(:ok)
    expect(response.body).to include('<div id="root">')
  end

  it "serves the app on a refresh of a client route like /login" do
    get "/login", headers: { "Accept" => "text/html" }
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("text/html")
    expect(response.body).to include('<div id="root">')
  end

  it "leaves unknown API paths as 404s, not the app" do
    get "/api/does-not-exist", headers: { "Accept" => "text/html" }
    expect(response).to have_http_status(:not_found)
    expect(response.body).not_to include('<div id="root">')
  end

  it "leaves missing assets as 404s, not the app" do
    get "/assets/missing.js"
    expect(response).to have_http_status(:not_found)
  end
end
