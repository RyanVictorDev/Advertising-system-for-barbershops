class Product < ApplicationRecord
  class OrderError < StandardError; end

  ACCEPTED_TYPES = %w[image/jpeg image/jpg image/png image/webp].freeze
  MAX_IMAGE_BYTES = 8.megabytes

  belongs_to :shop
  has_one_attached :image, dependent: :purge

  before_validation :normalize_text
  before_validation :assign_position, on: :create

  validates :name, length: { maximum: 60 }
  validates :description, length: { maximum: 240 }
  validate :name_and_description
  validate :image_is_acceptable

  def self.reorder!(shop, ids)
    ordered = Array(ids).map(&:to_s)
    current = shop.products.order(:position).pluck(:id).map(&:to_s)
    unless ordered.size == current.size && ordered.sort == current.sort
      raise OrderError, "A ordem precisa incluir todos os produtos desta casa."
    end

    transaction do
      ordered.each_with_index do |id, index|
        shop.products.where(id: id).update_all(position: -(index + 1))
      end
      ordered.each_with_index do |id, index|
        shop.products.where(id: id).update_all(position: index + 1)
      end
    end
  end

  private
    def normalize_text
      self.name = name.to_s.strip
      self.description = description.to_s.strip
    end

    def assign_position
      return if position.present?

      self.position = shop.with_lock { (shop.products.maximum(:position) || 0) + 1 }
    end

    def name_and_description
      return if name.present? && description.present?

      errors.add(:base, "Preencha o nome e a descrição.")
    end

    def image_is_acceptable
      unless image.attached?
        errors.add(:base, "Escolha uma foto do produto.")
        return
      end

      unless ACCEPTED_TYPES.include?(image.blob.content_type)
        errors.add(:base, "Essa foto precisa ser JPEG, PNG ou WebP.")
      end

      return if image.blob.byte_size <= MAX_IMAGE_BYTES

      errors.add(:base, "Essa foto é grande demais. Escolha outra com menos de 8 MB.")
    end
end
