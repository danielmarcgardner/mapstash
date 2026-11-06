class EnforceTagOwnerAndUniqueJoins < ActiveRecord::Migration[8.1]
  def up
    # Unowned tags can't satisfy null: false. Seeds recreate them; down can't restore them.
    execute "DELETE FROM place_tags WHERE tag_id IN (SELECT id FROM tags WHERE user_id IS NULL)"
    execute "DELETE FROM tags WHERE user_id IS NULL"

    change_column_null :tags, :user_id, false
    add_index :tags, "user_id, lower(name)", unique: true, name: "index_tags_on_user_id_and_lower_name"
    add_index :place_tags, [ :place_id, :tag_id ], unique: true

    add_column :places, :google_place_id, :string
    add_index :places, :google_place_id
    change_column :places, :lat, :decimal, precision: 10, scale: 6
    change_column :places, :lng, :decimal, precision: 10, scale: 6
  end

  def down
    change_column :places, :lng, :decimal
    change_column :places, :lat, :decimal
    remove_index :places, :google_place_id
    remove_column :places, :google_place_id

    remove_index :place_tags, [ :place_id, :tag_id ]
    remove_index :tags, name: "index_tags_on_user_id_and_lower_name"
    change_column_null :tags, :user_id, true
  end
end
