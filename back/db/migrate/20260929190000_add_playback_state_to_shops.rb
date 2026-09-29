class AddPlaybackStateToShops < ActiveRecord::Migration[8.1]
  def change
    add_column :shops, :playback_index, :integer, null: false, default: 0
    add_column :shops, :playback_paused, :boolean, null: false, default: false
    add_column :shops, :playback_seq, :integer, null: false, default: 0
  end
end
