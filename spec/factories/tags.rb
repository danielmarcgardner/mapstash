# == Schema Information
#
# Table name: tags
#
#  id         :bigint           not null, primary key
#  color      :string           default("#c1d5f5"), not null
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  user_id    :bigint
#
# Indexes
#
#  index_tags_on_user_id  (user_id)
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :tag do
    sequence(:name) { |n| "Tag #{n}" }
    color { "#c1d5f5" }
  end
end
