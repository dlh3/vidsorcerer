// @ts-ignore
window.vidsorcerer.registerProviders({
  "xpass": {
    enabled: true,
    path: "/e",
    params: {
      "autostart": true,
    },
    domains: [
      "play.xpass.top",
    ]
  },
  "videasy": {
    enabled: true,
    path: "/",
    params: {
      autoplayNextEpisode: false,
      episodeSelector: true,
      nextEpisode: true,
    },
    domains: [
      "player.videasy.to",
    ]
  },
  "vidsrc": {
    enabled: true,
    path: "/embed",
    params: {
      autoplay: 1,
      autonext: 1,
    },
    domains: [
      "vidsrc2.ru",
      "vidsrcme.ru",
      "vidsrcme.su",
      "vidsrc-me.ru",
      "vidsrc-me.su",
      "vidsrc-embed.ru",
      "vidsrc-embed.su",
      "vsrc.su",
    ]
  },
  "vidgod": {
    enabled: true,
    path: "/",
    params: {},
    domains: [
      "vidgod.site",
      "vidgod.space",
    ]
  },
  "peachify": {
    enabled: false,
    path: "/",
    params: {},
    domains: [
      "peachify.pro",
    ]
  },
  "rapidstream": {
    enabled: true,
    path: "/embed",
    params: {},
    domains: [
      "ythd.org",
    ]
  },
  "vidcore": {
    enabled: true,
    path: "/",
    params: {
      autoPlay: true,
      nextButton: true,
    },
    domains: [
      "vidcore.net",
    ]
  },
  "viduki": {
    enabled: true,
    path: "/1",
    params: {},
    domains: [
      "viduki.net",
    ]
  },
});