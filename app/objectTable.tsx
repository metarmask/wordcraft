export function ObjectTable({ data = {}, level = 0 }) {
  if (!data || typeof data !== "object") return null;

  const indent = { paddingLeft: `${level * 20}px` };

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        {Object.entries(data).map(([key, value]) => {
          const isObject = typeof value === "object" && value !== null;

          return (
            <tr key={key}>
              <td style={{ fontWeight: "bold", border: "1px solid #ccc", ...indent }}>
                {key}
              </td>
              <td style={{ border: "1px solid #ccc" }}>
                {isObject ? (
                  <ObjectTable data={value} level={level + 1} />
                ) : (
                  String(value)
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};