class CreatePlaces < ActiveRecord::Migration[8.0]
  def change
    create_table :places do |t|
      t.string :title
      t.string :location_name
      t.string :address
      t.decimal :lat
      t.decimal :lng
      t.text :notes
      t.string :link_url
      t.string :image_url
      t.boolean :visited
      t.references :user, null: false, foreign_key: true

      t.timestamps
    end
  end
end
