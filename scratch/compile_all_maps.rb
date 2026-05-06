require 'json'
require 'fileutils'

module RPG
  class Map
    attr_accessor :width, :height, :tileset_id, :autoplay_bgm, :bgm, :autoplay_bgs, :bgs, :encounter_step, :encounter_list, :data, :events
  end
  class AudioFile
    attr_accessor :name, :volume, :pitch
  end
  class Event
    attr_accessor :id, :name, :x, :y, :pages
  end
  class Event::Page
    attr_accessor :condition, :graphic, :move_type, :move_speed, :move_frequency, :move_route, :walk_anime, :step_anime, :direction_fix, :through, :always_on_top, :trigger, :list
  end
  class Event::Page::Condition
    attr_accessor :switch1_valid, :switch2_valid, :variable_valid, :self_switch_valid, :switch1_id, :switch2_id, :variable_id, :variable_value, :self_switch_ch
  end
  class Event::Page::Graphic
    attr_accessor :tile_id, :character_name, :character_hue, :direction, :pattern, :opacity, :blend_type
  end
  class EventCommand
    attr_accessor :code, :indent, :parameters
  end
  class MoveRoute
    attr_accessor :repeat, :skippable, :list
  end
  class MoveCommand
    attr_accessor :code, :parameters
  end
end

class Tone
  def self._load(str)
    Tone.new
  end
end

class Color
  def self._load(str)
    Color.new
  end
end

class Table
  attr_accessor :data
  def self._load(str)
    t = Table.new
    t.data = str
    t
  end
end

def clean_string(str)
  str.force_encoding('ISO-8859-1').encode('UTF-8', invalid: :replace, undef: :replace, replace: '?')
end

def to_json_val(obj)
  case obj
  when nil, Numeric, true, false
    obj
  when String
    clean_string(obj)
  when Array
    obj.map { |v| to_json_val(v) }
  when Hash
    new_h = {}
    obj.each do |k, v|
      new_k = k.to_s.start_with?('@') ? k.to_s[1..-1] : k.to_s
      new_h[clean_string(new_k)] = to_json_val(v)
    end
    new_h
  when Table
    { "@data" => obj.data.bytes }
  when Tone, Color
    # Serialize Tone and Color as empty hashes to match the original compiler
    {}
  else
    # Any custom RPG class instance
    new_h = {}
    obj.instance_variables.each do |ivar|
      new_k = ivar.to_s[1..-1]
      new_h[clean_string(new_k)] = to_json_val(obj.instance_variable_get(ivar))
    end
    new_h
  end
end

# Maps to compile
maps = ['Map010', 'Map011', 'Map012', 'Map038', 'Map040']

maps.each do |map_id|
  rxdata_path = "Data/#{map_id}.rxdata"
  json_dest_1 = "Data/#{map_id}.json"
  json_dest_2 = "react-app/public/Data/#{map_id}.json"

  if File.exist?(rxdata_path)
    puts "Compiling #{rxdata_path}..."
    begin
      map_obj = Marshal.load(File.binread(rxdata_path))
      serialized = to_json_val(map_obj)
      
      # Pretty print to Data/
      File.write(json_dest_1, JSON.pretty_generate(serialized))
      
      # Save/copy to public/Data/
      FileUtils.mkdir_p("react-app/public/Data")
      File.write(json_dest_2, JSON.pretty_generate(serialized))
      
      puts "  Successfully compiled #{map_id} to JSON!"
    rescue => e
      puts "  Error compiling #{map_id}: #{e.class.name} - #{e.message}"
      puts e.backtrace.join("\n")
    end
  else
    puts "Warning: #{rxdata_path} not found!"
  end
end
