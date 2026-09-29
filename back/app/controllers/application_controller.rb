class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
  rescue_from ActiveRecord::RecordNotUnique, with: :record_not_unique

  private
    def record_not_found
      render json: { errors: [ "Não encontrei esse registro." ] }, status: :not_found
    end

    def record_invalid(error)
      render json: { errors: error.record.errors.full_messages }, status: :unprocessable_entity
    end

    def record_not_unique
      render json: { errors: [ "Não consegui salvar. Tente de novo." ] }, status: :unprocessable_entity
    end

    def render_salon(shop, status: :ok)
      render json: SalonSerializer.new(shop).as_json, status: status
    end
end
