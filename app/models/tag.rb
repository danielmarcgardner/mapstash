# == Schema Information
#
# Table name: tags
#
#  id         :bigint           not null, primary key
#  color      :string           default("#c1d5f5"), not null
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint           not null
#
# Indexes
#
#  index_tags_on_user_id                 (user_id)
#  index_tags_on_user_id_and_lower_name  (user_id, lower((name)::text)) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
class Tag < ApplicationRecord
  belongs_to :user
  has_many :place_tags, dependent: :destroy
  has_many :places, through: :place_tags

  validates :name, presence: true, uniqueness: { scope: :user_id, case_sensitive: false }
  validates :color, format: { with: /\A#\h{6}\z/, message: "must be a hex color like #c1d5f5" }
end
