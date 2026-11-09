require 'rails_helper'

RSpec.describe "User routes", type: :routing do
  it "routes GET /api/users/me" do
    expect(get: "/api/users/me").to route_to("api/users#me")
  end

  it "doesn't route the unused show and update actions" do
    expect(get: "/api/users/1").not_to be_routable
    expect(patch: "/api/users/1").not_to be_routable
    expect(put: "/api/users/1").not_to be_routable
  end
end
