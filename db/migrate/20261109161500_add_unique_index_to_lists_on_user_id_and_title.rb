class AddUniqueIndexToListsOnUserIdAndTitle < ActiveRecord::Migration[8.1]
  def up
    # Merge each set of same-titled lists into its oldest one: copy places across, then drop the copies.
    execute <<~SQL
      INSERT INTO list_places (list_id, place_id, created_at, updated_at)
      SELECT keep.id, lp.place_id, MIN(lp.created_at), NOW()
      FROM list_places lp
      JOIN lists l ON l.id = lp.list_id
      JOIN (SELECT user_id, title, MIN(id) AS id FROM lists GROUP BY user_id, title) keep
        ON keep.user_id = l.user_id AND keep.title = l.title AND keep.id <> l.id
      GROUP BY keep.id, lp.place_id
      ON CONFLICT (list_id, place_id) DO NOTHING
    SQL
    execute <<~SQL
      DELETE FROM list_places lp USING lists l, lists keep
      WHERE lp.list_id = l.id AND keep.user_id = l.user_id AND keep.title = l.title AND keep.id < l.id
    SQL
    execute <<~SQL
      DELETE FROM lists l USING lists keep
      WHERE keep.user_id = l.user_id AND keep.title = l.title AND keep.id < l.id
    SQL

    add_index :lists, [ :user_id, :title ], unique: true
  end

  def down
    remove_index :lists, [ :user_id, :title ]
  end
end
