# Pets: hunger, moods, and the Pet Shop

Files: `src/shared/house.js` (`PETS`, `PET_STARVE_MS`, `PET_MOODS`, `petMood`, `PET_ROAM`, `PET_REACH`,
`PET_DISPLAY`), `server/house.js` (each pet's belly: `pets`, `starve`, `feed`, buying a pet, warnings),
`src/pets.js` (the pet's card: E at a pet, Feed), `src/pet-art.js` (moods, the belly bar, food icons,
Auntie Clover's dress), `src/house.js` (pets wandering, drawn with their mood), `src/petshop.js` (the shop's
room and its front in the village), `src/store.js` (the buy card both shops share). Food: `pet_kibble`,
`pet_stew` in `ITEMS` (`food`), sold by `SHOPS.clover`. Room `PETSHOP` (27) and `CLOVER_X` in
`src/shared/rpg.js`; the village door `PETSHOP_DOOR_X` in `src/shared/sim.js`.

Pets themselves (mini bosses placed like furniture, their prices): `docs/places/houses.md`.

## Owner decisions (2026-10-21)
- "Pets have a hunger bar: they need to be fully fed every 2 days, if not they die. They get
  progressively sadder if they're not fed. There should be a pet shop for them."
- A full belly lasts `PET_STARVE_MS` (2 days). Food fills part of it (`food` on the item: kibble a
  quarter, stew all of it), never past full. When it reaches empty the pet **dies**: it's gone from the
  house and from what you own, for good (no refund). Real time: it goes down while you're offline, and
  while the pet is put away (otherwise putting it away would dodge the whole thing). A put-away pet can
  only be fed once it's out again; the warnings say so.
- Moods, from how full it is (`PET_MOODS`): Happy (hearts float up), Peckish (thinks of a full bowl),
  Hungry and sad (tears, an empty bowl), Starving and miserable (tears under a rain cloud). The hungrier,
  the flatter and greyer it's drawn and the less it wanders (`petLook`).
- The Pet Shop is its own building in Slimeville (between Pip's stall and the Lecture Hall), and pets are
  sold only there now (the furniture store's pet corner went). Every pet sits on a cushioned plinth with
  its price; E there opens the same buy card as the furniture store ("adopt"). A new pet comes home with a
  full belly.
- The shop's keeper, **Auntie Clover**, is a chattable AI character like Mochi (persona in
  `server/characters.js`): she sells the food (her Trade button) and repeats the care rules to everyone.
  She knows Tier 0 and animals only; her life (Pudding the Mini Turnipop who naps by the counter, knitting
  tiny scarves) is what she talks about.
- Guests can feed your pets with their own food (the owner gets a toast).

## How it works
- Each pet is one animal: the server keeps `pets: { id: { k, until } }` per house (saved in the house row;
  `until` is when its belly is empty). `owned[pet_k]` is just a count of the living ones (`countPets`), so
  the decorate panel and `cleanLayout` work as before.
- A pet in the layout carries its `id` (like a garden plot; ids share one numbering, `nextId`). One put
  down from the panel has none: `tag` gives it the hungriest put-away pet of that kind (put away, a pet
  can't be fed, so putting one out should bring out the one that needs it); a stale or duplicate id is
  sorted out the same way, and a pet item with no living pet behind it is dropped.
- Houses saved before pets got hungry (no `pets` in the row) turn each owned pet into an animal with a
  full belly at their first load.
- Every `PET_CHECK_MS` the server checks every loaded house: pets whose belly is empty die (`starve`); the
  owner gets a toast if online, otherwise the names wait in `lost` for their next login. An online owner
  also gets a toast when a pet turns Hungry and sad, and again at Starving (`warned`). At login: the lost
  pets, and the hungriest pet if it's below Happy.
- The house message carries `pets: { id: [ms until empty, ms a full belly lasts] }`; the client turns it
  into a time and works the mood out itself every frame (no resends while it drains).
- Feeding (`pet-feed`): you must be in that house and within reach of where the pet was put (it wanders,
  so the server allows `PET_ROAM` + `PET_REACH`); a pet at 98% or more is "full" and food isn't used.
  The food is used up from your bag (`take` in `server/rpg.js`).
- The client finds the pet you're at from where `src/house.js` last drew it (`spots`), shows its belly bar
  over it, and opens the card on E (after the garden plot / lab check, so a pet wandering past the lab
  doesn't steal E). The card closes when you walk well away from it.

## Pets with art of their own
Most pets are their boss's art shrunk by `PET_SCALE` (`drawPet` in `src/furniture.js`). A boss whose art doesn't shrink
into a pet gets its own drawing and size: `petWH` on the mob sets the furniture size, and `drawPet` hands it to the
drawing. The first is the **mini Ladon** (FB1 piece 3: `drawLadonPet` in `src/ladon-art.js`): three little heads on one
knot, the middle one crowned, and every few seconds the outer two turn on each other and snap while the middle one
looks away. The second is the **mini Fenrir** (FB2 (c2): `drawFenrirPet` in `src/fenrir-art.js`): a fluffy grey-white pup
in a ribbon collar of pale light; every few seconds it turns, catches the loose end of its ribbon and chews it, eyes shut
and tail going. Its plinth is why `PETSHOP_W` went up (the shop warns at startup if the plinths don't fit).

## Testing
- `TEST_PET_FAST=1440` makes a full belly last 2 minutes (test servers only, never live).

## Economy
- Food is priced as care, not a second price tag: `npm run economy` prints a pet food table and each
  pet's food a month against its price, and checks that a day of the cheapest feeding stays under
  `PET_UPKEEP_MAX_MIN` minutes of farming at the level where the first pet is affordable, and that a
  bigger portion is never dearer per belly.
