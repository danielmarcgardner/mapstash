# Idempotent: every record is found or created, scoped to the seed user, so running this twice changes nothing.
# Never delete here; fix bad dev data by hand.

user = User.find_or_create_by!(email: 'test@example.com') do |u|
  u.password = '12345678'
  u.first_name = 'Map'
  u.last_name = 'Stasher'
end

tag_names = [
  'Coffee', 'Hike', 'Scenic', 'Foodie', 'Hidden Gem', 'Sunset Spot', 'Urban Exploration', 'Nature Lover',
  'Cultural Experience', 'Adventure', 'Relaxation', 'Photography', 'Historical Site', 'Family Friendly',
  'Pet Friendly', 'Airbnb', 'Restaurant', 'Bar', 'Hotel', 'Museum', 'Park', 'Beach', 'Landmark', 'Shopping',
  'Nightlife'
]
tags = tag_names.index_with { |name| user.tags.where("lower(name) = ?", name.downcase).first_or_create!(name: name) }

lists = {
  'Child Activities' => 'Good things to do with kids',
  'AirBnbs' => 'Cool AirBnbs',
  'Destinations' => 'Things to do in places',
  'Restaurants' => 'Places to Try'
}.to_h { |title, description| [ title, user.lists.find_or_create_by!(title: title) { |l| l.description = description } ] }

[
  { title: 'Suwanee Playground', description: 'Fun playground for kids!', link_url: "https://www.instagram.com/reel/DI6VIyYAwG1/?igsh=MWx6bTB2NzF2YjhmZQ==", address: '421 Main St, Suwanee, GA 30024', lat: 34.059531, lng: -84.069953,
    list: 'Child Activities', tags: [ 'Family Friendly', 'Urban Exploration' ] },
  { title: 'Luxury Cabin', description: 'Couples fancy Airbnb in NC', link_url: "https://www.instagram.com/reel/DIUgWUqhuL2/?igsh=bnVpZ2o0NnpmejI1", address: "Hayesville, NC", lat: 35.045681, lng: -83.818428,
    list: 'AirBnbs', tags: [ 'Airbnb', 'Hotel' ] },
  { title: 'Winter Trip Guide Greenville', description: 'Things to do in Greenville, SC', link_url: "https://www.instagram.com/reel/DE3dPq2JTpQ/?igsh=MW96b25tazVkM3JmaA==", address: "Greenville, SC", lat: 34.850750, lng: -82.398956,
    list: 'Destinations', tags: [ 'Cultural Experience', 'Adventure', 'Relaxation', 'Urban Exploration' ] },
  { title: 'Trip to Dahlonega', description: 'Tips for a Trip to Dahlonega', link_url: "https://www.instagram.com/reel/DKCECphR4R7/?igsh=bWQ4aTgxZTN3dnE4", address: "Dahlonega, GA", lat: 34.533691, lng: -83.983269,
    list: 'Destinations', tags: [ 'Urban Exploration', 'Cultural Experience', 'Adventure' ] },
  { title: 'Sammys Sandwich Shop', description: 'Review for Sammys Sandwich shop!', link_url: "https://www.instagram.com/reel/DK7P0ORsmlK/?igsh=OGwwZjE2aG85aDhi", address: "565 Northside Dr SW Building 2, Atlanta, GA 30310", lat: 33.746500, lng: -84.407800,
    list: 'Restaurants', tags: [ 'Foodie', 'Restaurant' ] }
].each do |attrs|
  list_title = attrs.delete(:list)
  place_tags = attrs.delete(:tags)
  place = user.places.find_or_create_by!(title: attrs[:title]) { |p| p.assign_attributes(attrs) }

  ListPlace.find_or_create_by!(list: lists.fetch(list_title), place: place)
  place_tags.each { |name| PlaceTag.find_or_create_by!(place: place, tag: tags.fetch(name)) }
end

puts "Seed user #{user.email}: #{user.places.count} places, #{user.lists.count} lists, #{user.tags.count} tags"
