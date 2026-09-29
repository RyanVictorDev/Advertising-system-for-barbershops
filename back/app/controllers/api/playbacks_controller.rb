module Api
  class PlaybacksController < ApplicationController
    def create
      action = params.expect(playback: [ :action ])[:action].to_s
      unless PlaybackCommand::ACTIONS.include?(action)
        render json: { errors: [ "Esse comando de reprodução não existe." ] }, status: :unprocessable_entity
        return
      end

      command = PlaybackCommand.issue!(Shop.current, action)
      render json: { seq: command.seq, action: command.action }
    end
  end
end
