export function layoutForGroup(groupNo) {
  if (!Number.isInteger(groupNo) || groupNo < 0) throw new Error("Invalid group number");
  const parityPosition = groupNo % 5;
  const layout = [{ position: parityPosition, role: "parity", dataIndex: null }];
  let dataIndex = 0;
  for (let position = 0; position < 5; position += 1) {
    if (position !== parityPosition) {
      layout.push({ position, role: "data", dataIndex });
      dataIndex += 1;
    }
  }
  return layout.sort((left, right) => left.position - right.position);
}
