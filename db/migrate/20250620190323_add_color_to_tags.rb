class AddColorToTags < ActiveRecord::Migration[8.0]
  def change
    add_column :tags, :color, :string, null: false, default: '#c1d5f5'

    reversible do |dir|
      dir.up do
        # Set default color for existing tags
        execute <<-SQL.squish
          UPDATE tags SET color = '#c1d5f5' WHERE color IS NULL;
        SQL
      end

      dir.down do
        # Remove the color column if rolling back
        remove_column :tags, :color
      end
    end
  end
end
