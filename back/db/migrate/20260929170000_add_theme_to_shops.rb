class AddThemeToShops < ActiveRecord::Migration[8.1]
  def change
    add_column :shops, :appearance, :string, null: false, default: "dark", limit: 16
    add_column :shops, :palette, :string, null: false, default: "ouro", limit: 16
  end
end