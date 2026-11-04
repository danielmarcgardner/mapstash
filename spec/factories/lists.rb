FactoryBot.define do
  factory :list do
    user
    sequence(:title) { |n| "List #{n}" }
  end
end
