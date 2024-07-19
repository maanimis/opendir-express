function redirectToPath(path) {
  window.location.href += `directory${path}`;
}

function formatByte(size) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const pathElement = document.getElementById("path");
  const fileListElement = document
    .getElementById("file-list")
    .getElementsByTagName("tbody")[0];
  const dirInput = document.getElementById("dir-input");
  const goButton = document.getElementById("go-button");

  const loadDirectory = async (path) => {
    try {
      const response = await fetch(`/directory${path}`);

      if (!response.ok) {
        alert(`HTTP error ${response.status}: ${await response.text()}`);
        return;
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const absolutePath = data.path === "/" ? "/" : `/${data.path}`;
      pathElement.textContent = absolutePath;
      dirInput.placeholder = `Current directory: ${absolutePath}`;
      fileListElement.innerHTML = "";

      if (data.path !== "/") {
        const parentDir = data.path.split("/").slice(0, -1).join("/") || "/";
        const parentRow = fileListElement.insertRow();
        parentRow.innerHTML = `<td><a href="/${parentDir}" data-isDir="true">..</a></td><td>Directory</td><td></td><td></td>`;
      }

      data.files.forEach((file) => {
        const row = fileListElement.insertRow();
        const filePath = `/${data.path}/${file.name}`;
        const fileSize = file.isDirectory ? "" : `(${formatByte(file.size)})`;

        row.innerHTML = `
          <td><a href="${filePath}" data-isDir="${file.isDirectory}">${
          file.name
        }</a></td>
          <td>${file.isDirectory ? "Directory" : "File"}</td>
          <td>${fileSize}</td>
          <td>${
            file.isDirectory
              ? ""
              : `<a href="${filePath}" data-isDir="${file.isDirectory}">Download</a>`
          }</td>
        `;
      });

      fileListElement.querySelectorAll("a[data-isDir]").forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          const isDir = JSON.parse(link.getAttribute("data-isDir"));
          const href = link.getAttribute("href");
          isDir ? loadDirectory(href) : redirectToPath(href);
        });
      });
    } catch (error) {
      console.error("Error fetching directory listing:", error);
      fileListElement.innerHTML = `<tr><td colspan="4">Error fetching directory listing: ${error.message}</td></tr>`;
    }
  };

  // Load the initial directory or path
  const initialPath = window.location.pathname.replace(/\/+$/, "");
  loadDirectory(initialPath || "/");

  // Add event listener to the "Go" button
  goButton.addEventListener("click", () => {
    const newPath = dirInput.value.trim();
    if (newPath) {
      loadDirectory(newPath);
    }
  });
});
