# frozen_string_literal: true

# == Schema Information
#
# Table name: places
#
#  id            :bigint           not null, primary key
#  address       :string
#  description   :string
#  image_url     :string
#  lat           :decimal(, )
#  link_url      :string
#  lng           :decimal(, )
#  location_name :string
#  notes         :text
#  title         :string
#  visited       :boolean
#  created_at    :datetime         not null
#  updated_at    :datetime         not null
#  user_id       :bigint           not null
#
# Indexes
#
#  index_places_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class PlaceSerializer < ActiveModel::Serializer
  attributes :id, :title, :address, :lat, :lng, :description, :image_url, :link_url, :location_name, :notes, :visited, :created_at, :updated_at

  def address
    object.address || "No address provided"
  end

  def lat
    object.lat || "Not specified"
  end

  def lng
    object.lng || "Not specified"
  end
end
