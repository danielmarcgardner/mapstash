# == Schema Information
#
# Table name: lists
#
#  id          :bigint           not null, primary key
#  description :text
#  title       :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  user_id     :bigint           not null
#
# Indexes
#
#  index_lists_on_user_id            (user_id)
#  index_lists_on_user_id_and_title  (user_id,title) UNIQUE
#
# Foreign Keys
#
#  fk_rails_...  (user_id => users.id)
#
FactoryBot.define do
  factory :list do
    user
    sequence(:title) { |n| "List #{n}" }
  end
end
