class ProductSerializer
  def initialize(product)
    @product = product
  end

  def as_json
    {
      id: @product.id.to_s,
      name: @product.name,
      description: @product.description,
      position: @product.position,
      image_url: image_url
    }
  end

  private
    def image_url
      return unless @product.image.attached?

      Rails.application.routes.url_helpers.rails_blob_path(@product.image, only_path: true)
    end
end
