class CreatePlaybackCommands < ActiveRecord::Migration[8.1]
  def change
    create_table :playback_commands do |t|
      t.references :shop, null: false, foreign_key: true
      t.integer :seq, null: false
      t.string :action, null: false, limit: 16
      t.timestamps
    end

    add_index :playback_commands, [ :shop_id, :seq ], unique: true
  end
end
