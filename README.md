## Architecture

* [Fastify](https://github.com/fastify/fastify) server for OAuth flow and runtime configuration.
* Disk-based persistence of user credentials and certificates using [conf](https://github.com/sindresorhus/conf).
* Polling of the Spotify API for current artwork.
* Third-party libraries like [Jimp](https://github.com/jimp-dev/jimp) and [rpi-led-matrix](https://github.com/alexeden/rpi-led-matrix)
  to transform images and write them to the matrix.

## Prerequisites

The following steps must be completed before this software will be able to operate effectively.

#### Hardware Setup & Drivers

1. Ensure the matrix is properly connected and that drivers are installed. ([Guide](https://learn.adafruit.com/adafruit-rgb-matrix-bonnet-for-raspberry-pi/driving-matrices))
2. Disable the internal sound card to improve performance. ([Guide](https://jheyman.github.io/blog/pages/RaspberryPiTipsAndTricks/#disable-onboard-sound-raspbian-jessie))

#### Spotify Application Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Click the Create App button.
3. Fill out the application, including specifying the precise URL that will receive redirects from the
   OAth provider.

#### Project Setup

1. Create a `.env` file in the project root or otherwise set up the application to launch with the
   following environment variables set:

   * `HOSTNAME` - Hostname that will be used to generate self-signed certificates and OAuth redirect
     URLs.
   * `PORT` - Port that the server will listen on. This value is also used in OAuth redirect URLs.
   * `SPOTIFY_CLIENT_ID` - Client ID for the Spotify app created previously.
   * `SPOTIFY_CLIENT_SECRET` - Client secret for the Spotify app created previously.
   * `MATRIX_WIDTH` - Width of the matrix in pixels.
   * `MATRIX_HEIGHT` - Height of the matrix in pixels.

   See [`.env.example`](.env.example) for more.

2. Create a directory at `/etc/spotify-ish` and set its permission such that it is writable by anyone.

...
