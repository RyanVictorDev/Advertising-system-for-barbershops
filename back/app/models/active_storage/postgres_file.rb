module ActiveStorage
  class PostgresFile < ApplicationRecord
    self.table_name = "active_storage_postgres_files"
  end
end
