# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

user = User.find_or_create_by!(email: 'test@example.com') do |u|
  u.password = '12345678'
  u.first_name = 'Map'
  u.last_name = 'Stasher'
end

# Create some tags
tag_names = [
  'Coffee',
  'Hike',
  'Scenic',
  'Foodie',
  'Hidden Gem',
  'Sunset Spot',
  'Urban Exploration',
  'Nature Lover',
  'Cultural Experience',
  'Adventure',
  'Relaxation',
  'Photography',
  'Historical Site',
  'Family Friendly',
  'Pet Friendly',
  'Airbnb',
  'Restaurant',
  'Bar',
  'Hotel',
  'Museum',
  'Park',
  'Beach',
  'Landmark',
  'Shopping',
  'Nightlife'
  ]
tags = tag_names.map { |name| user.tags.find_or_create_by!(name: name) }

lists = [
  { title: 'Child Activities', description: 'Good things to do with kids', user_id: user.id },
  { title: 'AirBnbs', description: 'Cool AirBnbs', user_id: user.id },
  { title: 'Destinations', description: 'Things to do in places', user_id: user.id },
  { title: 'Restaurants', description: 'Places to Try', user_id: user.id }
].map { |attrs| List.find_or_create_by!(title: attrs[:title], user_id: attrs[:user_id]) { |l| l.assign_attributes(attrs) } }

places = [
  { title: 'Suwanee Playground', description: 'Fun playground for kids!', link_url: "https://www.instagram.com/reel/DI6VIyYAwG1/?igsh=MWx6bTB2NzF2YjhmZQ==", lat: 34.059531, lng: -84.069953, address: '421 Main St, Suwanee, GA 30024' },
  { title: 'Luxury Cabin', description: 'Couples fancy Airbnb in NC', link_url: "https://www.instagram.com/reel/DIUgWUqhuL2/?igsh=bnVpZ2o0NnpmejI1", address: "Hayesville, NC", lat: 35.045681, lng: -83.818428 },
  { title: 'Winter Trip Guide Greenville', description: 'Things to do in Greenville, SC', address: "Greenville, SC", link_url: "https://www.instagram.com/reel/DE3dPq2JTpQ/?igsh=MW96b25tazVkM3JmaA==", lat: 34.850750, lng: -82.398956 },
  { title: 'Trip to Dahlonega', description: 'Tips for a Trip to Dahlonega', address: "Dahlonega, GA",  lat: 34.533691, lng: -83.983269, link_url: "https://www.instagram.com/reel/DKCECphR4R7/?igsh=bWQ4aTgxZTN3dnE4" },
  { title: 'Sammys Sandwich Shop', description: 'Review for Sammys Sandwich shop!', link_url: "https://www.instagram.com/reel/DK7P0ORsmlK/?igsh=OGwwZjE2aG85aDhi", address: "565 Northside Dr SW Building 2, Atlanta, GA 30310", lat: 33.746500, lng: -84.407800 }
].map do |attrs|
  Place.find_or_create_by!(title: attrs[:title], user_id: user.id) { |p| p.assign_attributes(attrs) }
end

place_lists = [
  { list_id: List.find_by(title: lists[0].title).id, place_id: Place.find_by(title: places[0].title).id }, # Suwanee Playground in Child Activities
  { list_id: List.find_by(title: lists[1].title).id, place_id: Place.find_by(title: places[1].title).id }, # Luxury Cabin in AirBnbs
  { list_id: List.find_by(title: lists[2].title).id, place_id: Place.find_by(title: places[2].title).id }, # Winter Trip Guide Greenville in Destinations
  { list_id: List.find_by(title: lists[2].title).id, place_id: Place.find_by(title: places[3].title).id }, # Trip to Dahlonega in Destinations
  { list_id: List.find_by(title: lists[3].title).id, place_id: Place.find_by(title: places[4].title).id }  # Sammys Sandwich Shop in Restaurants
].map do |attrs|
  ListPlace.find_or_create_by!(attrs)
end
# Assign tags to places
place_tags = [
  { place_id: Place.find_by(title: places[0].title).id, tag_id: Tag.find_by(name: tags[12].name).id }, # Suwanee Playground tagged as Family Friendly
  { place_id: Place.find_by(title: places[0].title).id, tag_id: Tag.find_by(name: tags[5].name).id },  # Suwanee Playground tagged as Urban Exploration
  { place_id: Place.find_by(title: places[1].title).id, tag_id: Tag.find_by(name: tags[14].name).id }, # Luxury Cabin tagged as Airbnb
  { place_id: Place.find_by(title: places[1].title).id, tag_id: Tag.find_by(name: tags[17].name).id }, # Luxury Cabin tagged as Hotel
  { place_id: Place.find_by(title: places[2].title).id, tag_id: Tag.find_by(name: tags[8].name).id },  # Winter Trip Guide Greenville tagged as Cultural Experience
  { place_id: Place.find_by(title: places[2].title).id, tag_id: Tag.find_by(name: tags[9].name).id },  # Winter Trip Guide Greenville tagged as Adventure
  { place_id: Place.find_by(title: places[2].title).id, tag_id: Tag.find_by(name: tags[10].name).id }, # Winter Trip Guide Greenville tagged as Relaxation
  { place_id: Place.find_by(title: places[2].title).id, tag_id: Tag.find_by(name: tags[5].name).id }, # Winter Trip Guide Greenville tagged as Urban Exploration
  { place_id: Place.find_by(title: places[3].title).id, tag_id: Tag.find_by(name: tags[5].name).id }, # Trip to Dahlonega tagged as Urban Exploration
  { place_id: Place.find_by(title: places[3].title).id, tag_id: Tag.find_by(name: tags[8].name).id }, # Trip to Dahlonega tagged as Cultural Experience
  { place_id: Place.find_by(title: places[3].title).id, tag_id: Tag.find_by(name: tags[9].name).id }, # Trip to Dahlonega tagged as Adventure
  { place_id: Place.find_by(title: places[4].title).id, tag_id: Tag.find_by(name: tags[3].name).id },  # Sammys Sandwich Shop tagged as Foodie
  { place_id: Place.find_by(title: places[4].title).id, tag_id: Tag.find_by(name: tags[16].name).id }  # Sammys Sandwich Shop tagged as Restaurant

].map do |attrs|
  PlaceTag.find_or_create_by!(attrs)
end
# Output the created records
puts "Created #{User.count} user(s)"
puts "Created #{Tag.count} tag(s)"
puts "Created #{List.count} list(s)"
puts "Created #{Place.count} place(s)"
puts "Created #{ListPlace.count} list_place(s)"
