FactoryBot.define do
  factory :place do
    user
    sequence(:title) { |n| "Place #{n}" }
    address { "1 Main St" }
  end
end
