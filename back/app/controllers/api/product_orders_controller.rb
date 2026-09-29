module Api
  class ProductOrdersController < ApplicationController
    def update
      ids = params[:ids]
      unless ids.is_a?(Array)
        render json: { errors: [ "Informe a ordem dos produtos." ] }, status: :unprocessable_entity
        return
      end

      Product.reorder!(Shop.current, ids)
      render_salon(Shop.current)
    rescue Product::OrderError => error
      render json: { errors: [ error.message ] }, status: :unprocessable_entity
    end
  end
end
