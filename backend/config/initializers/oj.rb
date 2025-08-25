# Configure OJ as the default JSON encoder
require 'oj'

Oj.default_options = {
  mode: :rails,
  time_format: :ruby,
  bigdecimal_as_decimal: false
}