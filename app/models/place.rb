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
class Place < ApplicationRecord
  belongs_to :user
  has_many :list_places, dependent: :destroy
  has_many :place_tags, dependent: :destroy
  has_many :lists, through: :list_places
  has_many :tags, through: :place_tags

  validates :title, presence: true
  validates :lat, presence: true, numericality: { in: -90..90, allow_nil: true }
  validates :lng, presence: true, numericality: { in: -180..180, allow_nil: true }
  validate :link_url_is_http

  private

  def link_url_is_http
    return if link_url.blank?

    uri = URI.parse(link_url)
    errors.add(:link_url, "must be an http(s) URL") unless uri.is_a?(URI::HTTP) && uri.host.present?
  rescue URI::InvalidURIError
    errors.add(:link_url, "must be an http(s) URL")
  end
end
