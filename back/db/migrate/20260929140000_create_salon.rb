class CreateSalon < ActiveRecord::Migration[8.1]
  def change
    create_table :shops do |t|
      t.string :name, null: false, default: "", limit: 42
      t.string :tagline, null: false, default: "", limit: 42
      t.string :playlist_url, null: false, default: "", limit: 500
      t.boolean :live, null: false, default: false
      t.boolean :singleton, null: false, default: true
      t.timestamps
    end
    add_index :shops, :singleton, unique: true

    create_table :products do |t|
      t.references :shop, null: false, foreign_key: true
      t.string :name, null: false, limit: 60
      t.text :description, null: false
      t.integer :position, null: false
      t.timestamps
    end
    add_index :products, [ :shop_id, :position ], unique: true

    create_table :playlists do |t|
      t.references :shop, null: false, foreign_key: true
      t.string :url, null: false, limit: 500
      t.string :youtube_id, null: false, limit: 128
      t.datetime :last_selected_at, null: false
      t.timestamps
    end
    add_index :playlists, [ :shop_id, :youtube_id ], unique: true
  end
end
