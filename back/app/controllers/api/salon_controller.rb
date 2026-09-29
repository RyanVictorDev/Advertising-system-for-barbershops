module Api
  class SalonController < ApplicationController
    def show
      render_salon(Shop.current)
    end

    def update
      shop = Shop.current
      if shop.update(salon_params)
        render_salon(shop)
      else
        render json: { errors: shop.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private
      def salon_params
        params.expect(salon: [ :name, :tagline, :playlist_url, :live ])
      end
  end
end
