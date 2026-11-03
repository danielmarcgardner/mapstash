class CreateListPlaces < ActiveRecord::Migration[8.0]
  def change
    create_table :list_places do |t|
      t.references :list, null: false, foreign_key: true
      t.references :place, null: false, foreign_key: true

      t.timestamps
    end

    add_index :list_places, [ :list_id, :place_id ], unique: true

    remove_reference :places, :lists, foreign_key: true
  end
end
