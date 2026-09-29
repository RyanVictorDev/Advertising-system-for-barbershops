class CreateActiveStoragePostgresFiles < ActiveRecord::Migration[8.1]
  def change
    create_table :active_storage_postgres_files do |t|
      t.string :key, null: false
      t.binary :data, null: false
      t.timestamps
    end

    add_index :active_storage_postgres_files, :key, unique: true
  end
end
