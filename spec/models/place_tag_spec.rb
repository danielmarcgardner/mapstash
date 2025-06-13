# == Schema Information
#
# Table name: place_tags
#
#  id         :bigint           not null, primary key
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  place_id   :bigint           not null
#  tag_id     :bigint           not null
#
# Indexes
#
#  index_place_tags_on_place_id  (place_id)
#  index_place_tags_on_tag_id    (tag_id)
#
# Foreign Keys
#
#  fk_rails_...  (place_id => places.id)
#  fk_rails_...  (tag_id => tags.id)
#
require 'rails_helper'

RSpec.describe PlaceTag, type: :model do
  pending "add some examples to (or delete) #{__FILE__}"
end
