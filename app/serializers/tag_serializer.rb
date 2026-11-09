class TagSerializer < ActiveModel::Serializer
  attributes :id, :name, :color, :places_count

  # index selects places_count in one grouped query; single tags (create/update) count directly.
  def places_count
    object.has_attribute?(:places_count) ? object.places_count : object.place_tags.size
  end
end
