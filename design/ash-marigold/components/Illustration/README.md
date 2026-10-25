# Illustration (patrol map)

Dogeash illustrates protection as a plan, not a cartoon: top-down maps of homes and compounds with a dog's patrol route.

- Shapes from the system: rounded rectangles (`radius-lg`, `radius-xl`), discs for trees, a 10px `night` perimeter wall, a `night` house, `ash-soft` lawn on a bold `marigold` ground, `action` trees.
- The dog is a marigold disc with a `night` ring and a radar pulse. It walks a dashed charcoal route (`.patrol`), one lap every 18 seconds.
- Mono labels (`GATE`, `PERIMETER`, `PATROL ROUTE`) in `on-marigold`.
- Variations: house (Home hero), compound with two dogs (Compound tile), estate with gatehouse, empty route for empty states.
- Inline SVG, not GIF: sharp, light, themable. In night watch (dark mode) the marigold map glows against the near-black page.
- All movement stops under reduced motion.
