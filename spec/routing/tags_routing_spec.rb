require 'rails_helper'

RSpec.describe "Tag routes", type: :routing do
  it "no longer routes the GET add/remove actions that changed data" do
    expect(get: "/api/tags/add_tag_to_place").not_to route_to("api/tags#add_tag_to_place")
    expect(get: "/api/tags/remove_tag_from_place").not_to route_to("api/tags#remove_tag_from_place")
  end

  it "routes adding and removing a place's tag with POST and DELETE only" do
    expect(post: "/api/places/1/tags").to route_to("api/place_tags#create", place_id: "1")
    expect(delete: "/api/places/1/tags/2").to route_to("api/place_tags#destroy", place_id: "1", id: "2")
    expect(get: "/api/places/1/tags").not_to be_routable
    expect(get: "/api/places/1/tags/2").not_to be_routable
  end
end
