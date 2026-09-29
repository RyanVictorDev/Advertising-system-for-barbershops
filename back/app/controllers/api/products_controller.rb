module Api
  class ProductsController < ApplicationController
    def create
      shop = Shop.current
      product = shop.products.new(product_attributes)
      attach_image(product)
      if product.save
        render_salon(Shop.current, status: :created)
      else
        render json: { errors: product.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      product = Shop.current.products.find(params[:id])
      product.assign_attributes(product_attributes)
      attach_image(product)
      if product.save
        render_salon(Shop.current)
      else
        render json: { errors: product.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      Shop.current.products.find(params[:id]).destroy!
      render_salon(Shop.current)
    end

    private
      def product_params
        params.expect(product: [ :name, :description, :image ])
      end

      def product_attributes
        product_params.except(:image)
      end

      def attach_image(product)
        image = product_params[:image]
        product.image.attach(image) if image.present?
      end
  end
end
