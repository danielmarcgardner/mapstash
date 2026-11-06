class AddUserToTags < ActiveRecord::Migration[8.1]
  def change
    # Nullable because existing tags have no owner yet; "Give tags an owner and enforce unique joins" clears them and adds null: false.
    add_reference :tags, :user, foreign_key: true
  end
end
