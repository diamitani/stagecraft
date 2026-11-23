import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  addMonths,
  cleanBookingInput,
  cleanGenres,
  cleanVenueInput,
  cleanWaitlistInput,
  dollarsToCents,
  isRequestableDay,
  isValidDay,
  monthGrid,
  nextBookingStatus,
  platformFeeCents,
  venueMatchesSearch,
  type Venue,
} from "../lib/stagecraft-shared";

const TODAY = "2027-03-10";

test("dollarsToCents reads form amounts and rejects junk", () => {
  assert.deepEqual(dollarsToCents("1,250"), { ok: true, cents: 125000 });
  assert.deepEqual(dollarsToCents("$40.50"), { ok: true, cents: 4050 });
  assert.deepEqual(dollarsToCents(300), { ok: true, cents: 30000 });
  assert.deepEqual(dollarsToCents(""), { ok: true, cents: null });
  assert.deepEqual(dollarsToCents(undefined), { ok: true, cents: null });
  assert.equal(dollarsToCents("-5").ok, false);
  assert.equal(dollarsToCents("12.345").ok, false);
  assert.equal(dollarsToCents("abc").ok, false);
  assert.equal(dollarsToCents("999999999").ok, false);
});

test("platform fee is 5% of the deposit and never negative", () => {
  assert.equal(platformFeeCents(10000), 500);
  assert.equal(platformFeeCents(0), 0);
  assert.equal(platformFeeCents(-100), 0);
  assert.equal(platformFeeCents(333), 17);
});

test("cleanVenueInput requires name, city and a reachable email", () => {
  assert.deepEqual(cleanVenueInput({ name: "", city: "Austin" }, "a@b.co"), { ok: false, error: "Add your venue's name." });
  assert.equal(cleanVenueInput({ name: "Blue Room" }, "a@b.co").ok, false);
  assert.equal(cleanVenueInput({ name: "Blue Room", city: "Austin" }, "").ok, false);
  assert.equal(cleanVenueInput({ name: "Blue Room", city: "Austin", capacity: "lots" }, "a@b.co").ok, false);
  assert.equal(cleanVenueInput({ name: "Blue Room", city: "Austin", websiteUrl: "javascript:alert(1)" }, "a@b.co").ok, false);
  assert.equal(cleanVenueInput({ name: "Blue Room", city: "Austin", deposit: "0.50" }, "a@b.co").ok, false);

  const good = cleanVenueInput(
    {
      name: "The Blue Room!", city: "Austin", capacity: "1,200", venueType: "club", genres: "Jazz, soul, jazz",
      amenities: ["stage", "made_up", "pa_system"], rentalFee: "500", deposit: "100", imageUrl: "example.com/room.jpg",
    },
    "Owner@Example.com",
  );
  assert.ok(good.ok);
  if (good.ok) {
    assert.equal(good.value.slug, "the-blue-room");
    assert.equal(good.value.capacity, 1200);
    assert.deepEqual(good.value.genres, ["Jazz", "soul"]);
    assert.deepEqual(good.value.amenities, ["stage", "pa_system"]);
    assert.equal(good.value.rentalFeeCents, 50000);
    assert.equal(good.value.depositCents, 10000);
    assert.equal(good.value.contactEmail, "owner@example.com");
    assert.equal(good.value.imageUrl, "https://example.com/room.jpg");
    assert.equal(good.value.isPublished, true);
  }

  const unknownType = cleanVenueInput({ name: "X", city: "Y", venueType: "spaceship" }, "a@b.co");
  assert.ok(unknownType.ok && unknownType.value.venueType === "other");
  const askPrice = cleanVenueInput({ name: "X", city: "Y", rentalFee: "" }, "a@b.co");
  assert.ok(askPrice.ok && askPrice.value.rentalFeeCents === null && askPrice.value.depositCents === 0);
});

test("cleanGenres caps at 8 and de-duplicates", () => {
  assert.equal(cleanGenres(Array.from({ length: 12 }, (_, i) => `G${i}`)).length, 8);
  assert.deepEqual(cleanGenres(["Rock", " rock ", ""]), ["Rock"]);
});

test("day helpers handle real calendar dates only", () => {
  assert.ok(isValidDay("2028-02-29"));
  assert.ok(!isValidDay("2027-02-29"));
  assert.ok(!isValidDay("2027-13-01"));
  assert.ok(!isValidDay("tomorrow"));
  assert.equal(addDays("2027-12-31", 1), "2028-01-01");
  assert.equal(addMonths("2027-12", 1), "2028-01");
  assert.equal(addMonths("2027-01", -1), "2026-12");
});

test("monthGrid builds full Sunday-first weeks", () => {
  const weeks = monthGrid("2027-03"); // March 1, 2027 is a Monday
  assert.ok(weeks.every((w) => w.length === 7));
  assert.equal(weeks[0][0], null);
  assert.equal(weeks[0][1], "2027-03-01");
  assert.equal(weeks.flat().filter(Boolean).length, 31);
});

test("isRequestableDay blocks past, far-future and unavailable days", () => {
  const taken = new Set(["2027-03-12"]);
  assert.ok(isRequestableDay(TODAY, TODAY, taken));
  assert.ok(!isRequestableDay("2027-03-09", TODAY, taken));
  assert.ok(!isRequestableDay("2027-03-12", TODAY, taken));
  assert.ok(!isRequestableDay(addDays(TODAY, 366), TODAY, taken));
});

test("cleanBookingInput checks date, name, email and message", () => {
  const base = { eventDate: "2027-04-01", artistName: "Jay Rivers", message: "Five-piece soul band, two sets, about 80 people." };
  assert.equal(cleanBookingInput({ ...base, eventDate: "2027-03-01" }, { today: TODAY, fallbackEmail: "j@r.co" }).ok, false);
  assert.equal(cleanBookingInput({ ...base, eventDate: "2028-06-01" }, { today: TODAY, fallbackEmail: "j@r.co" }).ok, false);
  assert.equal(cleanBookingInput({ ...base, artistName: " " }, { today: TODAY, fallbackEmail: "j@r.co" }).ok, false);
  assert.equal(cleanBookingInput({ ...base, message: "hi" }, { today: TODAY, fallbackEmail: "j@r.co" }).ok, false);
  assert.equal(cleanBookingInput(base, { today: TODAY }).ok, false);
  assert.equal(cleanBookingInput({ ...base, artistEmail: "nope" }, { today: TODAY, fallbackEmail: "j@r.co" }).ok, false);
  assert.equal(cleanBookingInput({ ...base, expectedAttendance: "1.5" }, { today: TODAY, fallbackEmail: "j@r.co" }).ok, false);

  const good = cleanBookingInput({ ...base, eventType: "weird", expectedAttendance: "80" }, { today: TODAY, fallbackEmail: "J@R.co" });
  assert.ok(good.ok);
  if (good.ok) {
    assert.equal(good.value.artistEmail, "j@r.co");
    assert.equal(good.value.eventType, "show");
    assert.equal(good.value.expectedAttendance, 80);
  }
});

test("nextBookingStatus enforces who can do what", () => {
  assert.deepEqual(nextBookingStatus("pending", "accept", "venue", 5000), { ok: true, status: "accepted" });
  assert.deepEqual(nextBookingStatus("pending", "accept", "venue", 0), { ok: true, status: "confirmed" });
  assert.deepEqual(nextBookingStatus("pending", "decline", "venue"), { ok: true, status: "declined" });
  assert.equal(nextBookingStatus("pending", "accept", "artist").ok, false);
  assert.equal(nextBookingStatus("pending", "decline", "artist").ok, false);
  assert.equal(nextBookingStatus("accepted", "accept", "venue").ok, false);
  assert.deepEqual(nextBookingStatus("pending", "cancel", "artist"), { ok: true, status: "cancelled" });
  assert.deepEqual(nextBookingStatus("confirmed", "cancel", "venue"), { ok: true, status: "cancelled" });
  assert.equal(nextBookingStatus("declined", "cancel", "artist").ok, false);
  assert.equal(nextBookingStatus("cancelled", "cancel", "venue").ok, false);
});

test("venueMatchesSearch matches every word across name, city and genres", () => {
  const venue: Venue = {
    id: "1", slug: "blue-room", name: "Blue Room", venueType: "club", city: "Austin", region: "TX", address: "",
    capacity: 200, description: "", imageUrl: "", websiteUrl: "", genres: ["Jazz"], amenities: [],
    rentalFeeCents: null, depositCents: 0, isPublished: true,
  };
  assert.ok(venueMatchesSearch(venue, ""));
  assert.ok(venueMatchesSearch(venue, "austin jazz"));
  assert.ok(venueMatchesSearch(venue, "club"));
  assert.ok(!venueMatchesSearch(venue, "austin metal"));
});

test("cleanWaitlistInput needs a valid email and role", () => {
  assert.equal(cleanWaitlistInput({ email: "x", role: "fan" }).ok, false);
  assert.equal(cleanWaitlistInput({ email: "a@b.co", role: "promoter" }).ok, false);
  const good = cleanWaitlistInput({ email: "A@B.co", role: "sponsor", name: " Acme " });
  assert.ok(good.ok && good.value.email === "a@b.co" && good.value.name === "Acme");
});
