using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EMR.Server.Migrations
{
    /// <inheritdoc />
    public partial class StructuredAddressFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add new structured address columns
            migrationBuilder.AddColumn<string>(
                name: "AddressUse",
                table: "Patients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressType",
                table: "Patients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressText",
                table: "Patients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressLine",
                table: "Patients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressCity",
                table: "Patients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressDistrict",
                table: "Patients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressState",
                table: "Patients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressPostalCode",
                table: "Patients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AddressCountry",
                table: "Patients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            // Migrate existing address data to AddressText field
            migrationBuilder.Sql(@"
                UPDATE Patients 
                SET AddressText = Address 
                WHERE Address IS NOT NULL AND Address != ''
            ");

            // Drop the old Address column
            migrationBuilder.DropColumn(
                name: "Address",
                table: "Patients");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Add back the old Address column
            migrationBuilder.AddColumn<string>(
                name: "Address",
                table: "Patients",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            // Migrate AddressText back to Address
            migrationBuilder.Sql(@"
                UPDATE Patients 
                SET Address = AddressText 
                WHERE AddressText IS NOT NULL AND AddressText != ''
            ");

            // Drop the new structured address columns
            migrationBuilder.DropColumn(
                name: "AddressUse",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "AddressType",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "AddressText",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "AddressLine",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "AddressCity",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "AddressDistrict",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "AddressState",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "AddressPostalCode",
                table: "Patients");

            migrationBuilder.DropColumn(
                name: "AddressCountry",
                table: "Patients");
        }
    }
}