class ReplaceVisitedWithVisitedOnOnPlaces < ActiveRecord::Migration[8.1]
  def up
    add_column :places, :visited_on, :date
    # No visit date was ever recorded, so created_at is the best available guess.
    execute "UPDATE places SET visited_on = created_at::date WHERE visited = true"
    remove_column :places, :visited
  end

  def down
    add_column :places, :visited, :boolean
    execute "UPDATE places SET visited = true WHERE visited_on IS NOT NULL"
    remove_column :places, :visited_on
  end
end
