# frozen_string_literal: true

require "openssl"

module ActiveStorage
  # Guarda o arquivo numa coluna bytea. No Railway o disco do container
  # some a cada deploy; o Postgres é o que permanece, sem bucket extra.
  class Service::PostgresService < Service
    def initialize(public: false, **)
      @public = public
    end

    def upload(key, io, checksum: nil, **)
        instrument :upload, key: key, checksum: checksum do
        # Windows trata 0x1A como fim de arquivo em modo texto. O cabeçalho
        # de um PNG tem esse byte, então a leitura tem de ser binária.
        io.binmode if io.respond_to?(:binmode)
        io.rewind if io.respond_to?(:rewind)
        data = io.read
        ensure_integrity_of(data, checksum) if checksum

        file = PostgresFile.find_or_initialize_by(key: key)
        file.data = data
        file.save!
      end
    end

    def download(key, &block)
      data = bytes_for(key)

      if block_given?
        instrument :streaming_download, key: key do
          yield data
        end
      else
        instrument :download, key: key do
          data
        end
      end
    end

    def download_chunk(key, range)
      instrument :download_chunk, key: key, range: range do
        bytes_for(key).byteslice(range)
      end
    end

    def delete(key)
      instrument :delete, key: key do
        PostgresFile.where(key: key).delete_all
      end
    end

    def delete_prefixed(prefix)
      instrument :delete_prefixed, prefix: prefix do
        like = "#{ActiveRecord::Base.sanitize_sql_like(prefix)}%"
        PostgresFile.where("key LIKE ?", like).delete_all
      end
    end

    def exist?(key)
      instrument :exist, key: key do |payload|
        answer = PostgresFile.where(key: key).exists?
        payload[:exist] = answer
        answer
      end
    end

    private
      def bytes_for(key)
        file = PostgresFile.find_by(key: key)
        raise ActiveStorage::FileNotFoundError if file.nil?

        file.data
      end

      def ensure_integrity_of(data, checksum)
        return if OpenSSL::Digest::MD5.base64digest(data) == checksum

        raise ActiveStorage::IntegrityError
      end
  end
end
