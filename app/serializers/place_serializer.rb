# frozen_string_literal: true

# == Schema Information
#
# Table name: places
#
#  id              :bigint           not null, primary key
#  address         :string
#  description     :string
#  image_url       :string
#  lat             :decimal(10, 6)
#  link_url        :string
#  lng             :decimal(10, 6)
#  location_name   :string
#  notes           :text
#  title           :string
#  visited         :boolean
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  google_place_id :string
#  user_id         :bigint           not null
#
# Indexes
#
#  index_places_on_google_place_id  (google_place_id)
#  index_places_on_user_id          (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class PlaceSerializer < ActiveModel::Serializer
  attributes :id, :title, :address, :lat, :lng, :description, :image_url, :link_url, :location_name, :notes, :visited,
             :google_place_id, :tags, :created_at, :updated_at

  def address
    object.address || "No address provided"
  end

  # Decimal columns serialize as strings by default; the client expects numbers.
  def lat
    object.lat&.to_f
  end

  def lng
    object.lng&.to_f
  end

  def tags
    object.tags.map { |tag| { id: tag.id, name: tag.name, color: tag.color } }
  end
end
