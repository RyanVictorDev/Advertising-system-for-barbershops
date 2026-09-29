class AddTitleToPlaylists < ActiveRecord::Migration[8.1]
  def change
    add_column :playlists, :title, :string, limit: 200
  end
end
