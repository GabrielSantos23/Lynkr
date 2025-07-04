import TagDialog from "../TagDialog";

// ... existing code ...

const [title, setTitle] = useState(bookmark.title);
const [openTagDialog, setOpenTagDialog] = useState(false);

// ... existing code ...

<ContextMenuContent
  bookmark={{ ...bookmark, title: title }}
  setIsEditing={setIsEditing}
  isPrivatePage={isPrivatePage}
  onOpenTagDialog={() => setOpenTagDialog(true)}
/>
</ContextMenu.Portal>
<TagDialog
  bookmark={{ ...bookmark, title: title, tags: bookmark.tags ?? [] }}
  open={openTagDialog}
  onOpenChange={setOpenTagDialog}
/>
</ContextMenu.Root>
