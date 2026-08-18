export function isValidPlayerSaveData(
  data: unknown
): data is PlayerSaveData {

  if (
    !data ||
    typeof data !== "object"
  ) {
    return false;
  }

  const save =
    data as Partial<PlayerSaveData>;

  // ----------------------------------------------------------
  // Version
  // ----------------------------------------------------------

  if (
    typeof save.version !== "number" ||
    !Number.isFinite(save.version) ||
    save.version < 1
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Economy
  // ----------------------------------------------------------

  if (
    !save.economy ||
    typeof save.economy !== "object"
  ) {
    return false;
  }

  if (
    !save.economy.wallet ||
    typeof save.economy.wallet !== "object"
  ) {
    return false;
  }

  if (
    !Number.isFinite(save.economy.wallet.coin) ||
    save.economy.wallet.coin < 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(save.economy.wallet.pi) ||
    save.economy.wallet.pi < 0
  ) {
    return false;
  }

  if (
    !Array.isArray(save.economy.transactions)
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Garage
  // ----------------------------------------------------------

  if (
    !save.garage ||
    typeof save.garage !== "object"
  ) {
    return false;
  }

  if (
    !Array.isArray(save.garage.ownedCars)
  ) {
    return false;
  }

  if (
    typeof save.garage.selectedCar !== "string"
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Upgrades
  // ----------------------------------------------------------

  if (
    !save.upgrades ||
    typeof save.upgrades !== "object"
  ) {
    return false;
  }

  if (
    !save.upgrades.upgrades ||
    typeof save.upgrades.upgrades !== "object"
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Progress
  // ----------------------------------------------------------

  if (
    !save.progress ||
    typeof save.progress !== "object"
  ) {
    return false;
  }

  if (
    !Number.isFinite(save.progress.unlockedLevel) ||
    save.progress.unlockedLevel < 1
  ) {
    return false;
  }

  if (
    !Number.isFinite(save.progress.racesCompleted) ||
    save.progress.racesCompleted < 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(save.progress.racesWon) ||
    save.progress.racesWon < 0
  ) {
    return false;
  }

  if (
    !Number.isFinite(save.progress.totalDistance) ||
    save.progress.totalDistance < 0
  ) {
    return false;
  }

  // ----------------------------------------------------------
  // Timestamp
  // ----------------------------------------------------------

  if (
    typeof save.updatedAt !== "number" ||
    !Number.isFinite(save.updatedAt) ||
    save.updatedAt <= 0
  ) {
    return false;
  }

  return true;
}
